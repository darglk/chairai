-- Migration: Create function for getting artisan reviews with pagination and summary (FIX)
-- This function returns both paginated reviews and aggregated statistics in a single call
-- to optimize database round-trips and improve performance.

-- Drop function if exists (for idempotency)
DROP FUNCTION IF EXISTS get_artisan_reviews_and_summary(uuid, int, int);

-- Create function to get artisan reviews with pagination and summary
CREATE OR REPLACE FUNCTION get_artisan_reviews_and_summary(
  artisan_id_param uuid,
  page_num int DEFAULT 1,
  page_size int DEFAULT 20
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  offset_val int;
  total_count int;
  avg_rating numeric;
  rating_dist jsonb;
  reviews_data jsonb;
BEGIN
  -- Validate pagination parameters
  IF page_num < 1 THEN
    page_num := 1;
  END IF;
  
  IF page_size < 1 OR page_size > 100 THEN
    page_size := 20;
  END IF;
  
  -- Calculate offset
  offset_val := (page_num - 1) * page_size;
  
  -- Check if artisan exists
  IF NOT EXISTS (
    SELECT 1 FROM artisan_profiles WHERE user_id = artisan_id_param
  ) THEN
    RAISE EXCEPTION 'Artisan not found' USING ERRCODE = 'P0001';
  END IF;
  
  -- Get total count of reviews
  SELECT COUNT(*)
  INTO total_count
  FROM reviews
  WHERE reviewee_id = artisan_id_param;
  
  -- Get average rating
  SELECT COALESCE(AVG(rating), 0)
  INTO avg_rating
  FROM reviews
  WHERE reviewee_id = artisan_id_param;
  
  -- Get rating distribution
  SELECT jsonb_build_object(
    '5', COALESCE(SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END), 0),
    '4', COALESCE(SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END), 0),
    '3', COALESCE(SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END), 0),
    '2', COALESCE(SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END), 0),
    '1', COALESCE(SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END), 0)
  )
  INTO rating_dist
  FROM reviews
  WHERE reviewee_id = artisan_id_param;
  
  -- Get paginated reviews with related data
  SELECT jsonb_agg(review_obj)
  INTO reviews_data
  FROM (
    SELECT jsonb_build_object(
      'id', r.id,
      'project', jsonb_build_object(
        'id', p.id,
        'category', jsonb_build_object(
          'name', c.name
        )
      ),
      'reviewer', jsonb_build_object(
        'id', r.reviewer_id,
        'name', CASE 
          WHEN au.raw_user_meta_data->>'full_name' IS NOT NULL 
          THEN au.raw_user_meta_data->>'full_name'
          ELSE SPLIT_PART(au.email, '@', 1)
        END
      ),
      'rating', r.rating,
      'comment', r.comment,
      'created_at', r.created_at
    ) AS review_obj
    FROM reviews r
    INNER JOIN projects p ON r.project_id = p.id
    INNER JOIN categories c ON p.category_id = c.id
    INNER JOIN auth.users au ON r.reviewer_id = au.id
    WHERE r.reviewee_id = artisan_id_param
    ORDER BY r.created_at DESC
    LIMIT page_size
    OFFSET offset_val
  ) subquery;
  
  -- If no reviews found, return empty array
  IF reviews_data IS NULL THEN
    reviews_data := '[]'::jsonb;
  END IF;
  
  -- Build the complete response
  result := jsonb_build_object(
    'data', reviews_data,
    'pagination', jsonb_build_object(
      'page', page_num,
      'limit', page_size,
      'total', total_count,
      'total_pages', CEIL(total_count::numeric / page_size::numeric)
    ),
    'summary', jsonb_build_object(
      'average_rating', ROUND(avg_rating, 2),
      'total_reviews', total_count,
      'rating_distribution', rating_dist
    )
  );
  
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_artisan_reviews_and_summary(uuid, int, int) TO authenticated;
GRANT EXECUTE ON FUNCTION get_artisan_reviews_and_summary(uuid, int, int) TO anon;

-- Add comment
COMMENT ON FUNCTION get_artisan_reviews_and_summary IS 
'Returns paginated reviews for an artisan along with summary statistics. Used by GET /api/artisans/{id}/reviews endpoint.';
